%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
%% This is a very simple implementation of map-reduce, in both 
%% sequential and parallel versions.
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

-module(map_reduce).
-compile(export_all).

%% We begin with a simple sequential implementation, just to define
%% the semantics of map-reduce. 

%% The input is a collection of key-value pairs. The map function maps
%% each key value pair to a list of key-value pairs. The reduce
%% function is then applied to each key and list of corresponding
%% values, and generates in turn a list of key-value pairs. These are
%% the result.

map_reduce_seq(Map,Reduce,Input) ->
    Mapped = [{K2,V2}
	      || {K,V} <- Input,
		 {K2,V2} <- Map(K,V)],
    reduce_seq(Reduce,Mapped).

reduce_seq(Reduce,KVs) ->
    [KV || {K,Vs} <- group(lists:sort(KVs)),
	   KV <- Reduce(K,Vs)].

group([]) ->
    [];
group([{K,V}|Rest]) ->
    group(K,[V],Rest).

group(K,Vs,[{K,V}|Rest]) ->
    group(K,[V|Vs],Rest);
group(K,Vs,Rest) ->
    [{K,lists:reverse(Vs)}|group(Rest)].

split_into(N,L) ->
    split_into(N,L,length(L)).

split_into(1,L,_) ->
    [L];
split_into(N,L,Len) ->
    {Pre,Suf} = lists:split(Len div N,L),
    [Pre|split_into(N-1,Suf,Len-(Len div N))].

spawn_reducer(Parent,Reduce,I,Mappeds) ->
    Inputs = [KV
          || Mapped <- Mappeds,
         {J,KVs} <- Mapped,
         I==J,
         KV <- KVs],
    spawn_link(fun() -> Parent ! {self(),reduce_seq(Reduce,Inputs)} end).

spawn_mapper(Parent,Map,R,Split) ->
    spawn_link(fun() ->
            Mapped = [{erlang:phash2(K2,R),{K2,V2}}
                  || {K,V} <- Split,
                     {K2,V2} <- Map(K,V)],
            Parent ! {self(),group(lists:sort(Mapped))}
        end).

map_reduce_par(Map,M,Reduce,R,Input) ->
    Parent = self(),
    Splits = split_into(M,Input),
    Mappers = 
    [spawn_mapper(Parent,Map,R,Split)
     || Split <- Splits],
    Mappeds = 
    [receive {Pid,L} -> L end || Pid <- Mappers],
    Reducers = 
    [spawn_reducer(Parent,Reduce,I,Mappeds) 
     || I <- lists:seq(0,R-1)],
    Reduceds = 
    [receive {Pid,L} -> L end || Pid <- Reducers],
    lists:sort(lists:flatten(Reduceds)).

% Distributed solution
map_reduce_dist(Map, M, Reduce, R, Input) ->
    Splits = assign_dist(split_into(M,Input)),
    Mappers = [rpc:async_call(Node, map_reduce, spawn_mapper_dist, [Map, R, Split]) 
               || {Node, Split} <- Splits],
    MapYield = [rpc:yield(Key) || Key <- Mappers],
    % instead of doing a I==J check in spawn_reducer_dist i sort the entire list here
    Mappeds = assign_dist(element(2, lists:unzip(group(lists:sort(lists:flatten(MapYield)))))),
    Reducers = [rpc:async_call(Node, map_reduce, spawn_reducer_dist, [Reduce, Mapped]) 
               || {Node, Mapped} <- Mappeds],
    Reduceds = [rpc:yield(Key) || Key <- Reducers],
    lists:sort(lists:flatten(Reduceds)).

assign_dist(Splits) ->
    assign_dist(nodes(), Splits).

assign_dist(_, []) ->
    [];

assign_dist([], Splits) ->
    assign_dist(nodes(), Splits); 

assign_dist([Node | Nodes], [Split | Splits]) ->
    [{Node, Split} | assign_dist(Nodes, Splits)].


spawn_mapper_dist(Map, R, Split) ->
    % dets:open_file and dets:close is only necessary because page_rank:map needs it.
    % we could instead modify page_rank:map to include this,
    % but I added it here to reduce the number of calls
    dets:open_file(web, [{file, "web.dat"}]),
    Mapped = [{erlang:phash2(K2,R),{K2,V2}}
              || {K,V} <- Split,
                 {K2,V2} <- Map(K,V)],
    dets:close(web),
    group(lists:sort(Mapped)).

spawn_reducer_dist(Reduce, Mapped) ->
    reduce_seq(Reduce, lists:flatten(Mapped)).

% Distributed Load-balancing fault-tolerant solution
map_reduce_fault(Map,M,Reduce,R,Input) ->
    Splits = split_into(M,Input),
    Mappeds = worker_pool([{fun dist_spawn_mapper/3, [Map, R, Split]} || Split <- Splits]),
    Reduceds = worker_pool([{fun dist_spawn_reducer/3, [Reduce, I, Mappeds]} || I <- lists:seq(0, R-1)]),
    lists:sort(lists:flatten(Reduceds)).

worker_pool(Funs) ->
    Master = self(), 
    Ref = make_ref(),
    NodeCapacity = [{Node, rpc:block_call(Node, erlang, system_info, [logical_processors])} || Node <- nodes()],
    Nodes = lists:flatten([lists:duplicate(N, Node) || {Node, N} <- NodeCapacity]), %A node for each logical processor
    Pids = [spawn(Node, map_reduce, init_node, [Master, Ref]) || Node <- Nodes], %Initialize all nodes
    PidNodes = lists:zip(Pids, Nodes), % {Pid, Node}
    WorkRefList = [make_ref() || _ <- Funs], 
    WorkList = lists:zip(WorkRefList, Funs), %{WorkRef, {Fun, Arg}}
    ProcessRefList = [erlang:monitor(process, Pid) || Pid <- Pids], % Monitor all processes in all nodes
    {AlivePidNodes, LastWork} = sendWork(WorkList, PidNodes, WorkList, Master, Ref, #{}), % Distribute work to all nodes
    Work = retrieveWork(WorkList, LastWork, AlivePidNodes, WorkList, Master, Ref), % Retrieve all work
    [erlang:demonitor(ProcessRef) || ProcessRef <- ProcessRefList], % Demonitor all nodes
    [Pid ! {Ref, no_work} || Pid <- Pids], % Kill all nodes
    Work.

retrieveWork([], _, _, _, _, _) -> [];
retrieveWork([{WorkRef, {Fun, Args}}|RemainingWork], LastWork, PidNodes, AllWork, Master, Ref) ->
    receive
        {WorkRef, work_done, Work} ->
            Work,
            retrieveWork(RemainingWork, LastWork, PidNodes, AllWork, Master, Ref);
        {'DOWN', _, process, Pid, _Reason} -> 
            case maps:is_key(Pid, LastWork) of
                true -> % Process has died while doing work.
                    {CrashRef, _Node} = maps:get(Pid, LastWork), %Find the reference of the work
                    case lists:keyfind(CrashRef, 1, AllWork) of
                        Work ->
                            sendWork([Work], PidNodes, AllWork, Master, Ref, LastWork), %Re-distribute the work
                            retrieveWork([{WorkRef, {Fun, Args}}|RemainingWork], LastWork, PidNodes, AllWork, Master, Ref)
                     end;
                false ->
                    NewPidNodes = lists:keydelete(Pid, 1, PidNodes), %The process has no last work, remove it from the list of nodes.
                    retrieveWork([{WorkRef, {Fun, Args}}|RemainingWork], LastWork, NewPidNodes, AllWork, Master, Ref)
            end
    end.

sendWork([], PidNodes, _, _, _, LastWork) -> {PidNodes, LastWork};
sendWork([{WorkRef, {Fun, Arg}}|RemainingWork], PidNodes, AllWork, Master, Ref, LastWork) ->
    receive 
        {get_work, Ref, Pid, Node} -> %Work requested
            Pid ! {WorkRef, work, Fun, Arg}, %Send work to a node
            UpdateLastWork = maps:put(Pid, {WorkRef, Node}, LastWork), %Update this process last work.
            sendWork(RemainingWork, PidNodes, AllWork, Master, Ref, UpdateLastWork);
        {'DOWN', _, process, Pid, _Reason}  ->
                    case maps:is_key(Pid, LastWork) of
                        true ->
                            {CrashRef, Node} = maps:get(Pid, LastWork),
                            UpdateLastWork = maps:remove(Pid, LastWork),
                            case lists:keyfind(CrashRef, 1, AllWork) of
                                Work -> % Process has died trying to do work
                                    Key = rpc:async_call(Node, map_reduce, init_node, [Master, Ref]),
                                    UpdateWorkList = [Work] ++ [{WorkRef, {Fun, Arg}}|RemainingWork], % Add the crashed work to the list of work
                                    timer:sleep(10), %wait for the node to start up
                                    case rpc:nb_yield(Key, 0) of
                                        timeout -> % The node woke up
                                            sendWork(UpdateWorkList, PidNodes, AllWork, Master, Ref, UpdateLastWork);
                                        _ -> % The node is down
                                            RemainingNodes = lists:delete({Pid, Node}, PidNodes),
                                            sendWork(UpdateWorkList, RemainingNodes, AllWork, Master, Ref, UpdateLastWork)
                                    end
                            end;
                        false -> % The node has no last work
                            NewPidNodes = lists:keydelete(Pid, 1, PidNodes),
                            sendWork([{WorkRef, {Fun, Arg}}|RemainingWork], NewPidNodes, AllWork, Master, Ref, LastWork)
                    end
            end.

init_node(Master, Ref) ->
    Pid = self(),
    worker_process(Master, node(), Pid, Ref).

worker_process(Master, Node, Pid, Ref) ->
    Master ! {get_work, Ref, Pid, Node}, %Request work
    receive 
        {WorkRef, work, Fun, Arg} ->
            Master ! {WorkRef, work_done, apply(Fun, Arg)}, %Do work and then send the work to master 
            worker_process(Master, Node, Pid, Ref); 
        {Ref, no_work} -> 
            die 
    end.    


dist_spawn_mapper(Map,R,Split) ->
            group(lists:sort([{erlang:phash2(K2,R),{K2,V2}}
                  || {K,V} <- Split,
                     {K2,V2} <- Map(K,V)])).

dist_spawn_reducer(Reduce,I,Mappeds) ->
    Inputs = [KV
          || Mapped <- Mappeds,
         {J,KVs} <- Mapped,
         I==J,
         KV <- KVs],
    reduce_seq(Reduce,Inputs).

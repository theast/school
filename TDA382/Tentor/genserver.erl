-module(genserver).
-export([start/3, request/2, update/2]).

start(Name, State, F) ->
	Pid = spawn(fun() -> loop(State, F) end),
	register(Name, Pid).

loop(State, F) ->
    receive
        stop -> true ;
 
        {update, From, Ref, NewF} ->
                 From ! {ok, Ref},
                 loop(State, NewF);
 
        {request, From, Ref, Data} ->
                  case catch(F(State, Data)) of
                      {'EXIT', Reason} ->
                             From!{exit, Ref, Reason},
                             loop(State, F);
                      {R, NewState} ->
                             From!{result, Ref, R},
                             loop(NewState, F)
                  end
    end.

request(Pid, Data) ->
    Ref = make_ref(),
    Pid!{request, self(), Ref, Data},
    receive
        {result, Ref, Result} ->
            Result;
        {exit, Ref, Reason} ->
            exit(Reason)
    end.
    
update(Pid, Fun) ->
    Ref = make_ref(),
    Pid!{update, self(), Ref, Fun},
    receive
    {ok, Ref} ->
        ok
    end.
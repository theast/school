-module(reduce).
-compile(export_all).

reduce(Parent, Ref, _, [X]) ->
    Parent ! {solo,Ref,X};

reduce(Parent, Ref, F, [X,Y]) ->
    Parent ! {double, Ref, F(X,Y)};

reduce(Parent, Ref, F, L) ->
    {L1,L2} = lists:split(length(L) div 2,L),
    spawn_link(fun() -> reduce(Parent, Ref, F, L1) end),
    spawn_link(fun() -> reduce(Parent, Ref, F, L2) end).

reduce(F, L) ->
    Parent = self(),
    Ref = make_ref(),
    reduce(Parent, Ref, F, L),
    collect(Ref, F, 0, length(L) div 2).

collect(_, _, Res, 0) -> Res;
collect(Ref, F, Res, 1) ->
    io:format("yada"),
    receive
        {Ref, X} ->
            collect(Ref, F, F(Res,X), 0)
    end;
collect(Ref, F, Res, N) ->
    io:format("HEHEHE: ~p~n", [N]),
    receive 
        {double, Ref, X} ->
            io:format("hello: ~p~n", [X]),
            receive 
                {Ref,Y} ->
                    io:format("tjenna: ~p~n", [Y]),
                    collect(Ref, F, F(Res, F(X,Y)), N-1);
         {solo, Ref, X} ->
             collect(Ref, F, F(Res,X), N-1)
            end
    end.

add(X, Y) ->
    X+Y.

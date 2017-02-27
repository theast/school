-module(five).
-compile(export_all).

r(_, [X], 0) ->
    X;
r(_, [], 0) ->
    error;
r(F, [X, Y | L], N) ->
    Parent = self(),
    spawn_link(fun()-> Parent ! F(X,Y) end),
    r(F, L, N+1);
r(F, L, N) ->
    receive
        X ->
            r(F, [X]++L, N-1)
    end.

reduce(Parent, _, [X]) ->
    Parent ! X;

reduce(Parent, F, [X,Y]) ->
    spawn_link(fun()-> Parent ! F(X,Y) end);

reduce(Parent, F, L) ->
    {L1,L2} = lists:split(length(L) div 2,L),
    spawn_link(fun() -> reduce(Parent, F, L2) end),
    spawn_link(fun() -> reduce(Parent, F, L1) end).

reduce(F, L) ->
    Parent = self(),
    spawn_link(fun() -> reduce(Parent, F, L) end),
    collect(Parent, F, length(L)-1).

collect(_, _, 0) -> 
    receive X ->
            X
    end;

collect(_, _, 1) -> 
    io:format("Iteration: 1~n"),
    receive X ->
        X
    end;
collect(Parent, F, N) ->
    io:format("Iteration: ~p~n", [N]),
    receive
        X ->
            io:format("~p~n", [X]),
            receive
                Y ->
                    io:format("~p~n", [Y]),
                    spawn_link(fun() -> Parent ! F(X, Y) end),
                    collect(Parent, F, N-1)
            end 
    end.

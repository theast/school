-module(sort).
-compile(export_all).

merge_sort([], _) -> 
    [];

merge_sort([X], _) -> 
    [X];

merge_sort(Xs, 0) ->
    {Ys,Zs} = split(Xs),
    merge (merge_sort(Ys, 0), merge_sort(Zs, 0));
merge_sort(Xs, D) ->
    Parent = self(),
    {Ys,Zs} = split(Xs),
    Pid = spawn_link(fun() -> Parent ! {self(), merge_sort(Ys, D-1)} end),
    Z = merge_sort(Zs, D-1),
    receive
        {Pid, Y} ->
            merge(Y, Z)
    end.

merge([],Ys) -> Ys;

merge(Xs,[]) -> Xs;

merge([X|Xs],[Y|Ys]) when X =< Y ->
    [X|merge(Xs,[Y|Ys])];

merge([X|Xs],[Y|Ys]) -> [Y|merge([X|Xs],Ys)].

split(Xs) -> split([],Xs,Xs).
split(L,[X|R],[_,_|Xs]) -> split([X|L],R,Xs);
split(L,R,_) -> {L,R}.

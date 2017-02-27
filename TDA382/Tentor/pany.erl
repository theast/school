-module(pany).
-export([any/2, gather/1, distribute/2, pany/2]).

any(_P, []) -> false ;

any(P, [H|T]) -> case P(H) of
	true -> true;
	false -> any(P,T)
end.

gather(0) -> false;
gather(N) ->
	receive
	true -> true;
	false -> gather(N-1)
	end.

distribute(List, P) ->
Pid = self(),
lists:foreach(fun(A) -> spawn(fun() -> Pid ! P(A) end) end, List).

pany(P, List) ->
distribute(List, P),
gather(erlang:length(List)).


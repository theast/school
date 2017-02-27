-module(pmap).
-export([gather/2, distribute/3, pmap/2]).

gather(0, _Ref) -> [];
gather(N, Ref) ->
	receive
		{Ref, Result} ->
			[Result | gather(N-1, Ref)]
	end.

distribute(List, F, Ref) ->
Pid = self(),
spawn(fun() -> lists:foreach(fun(A) -> Pid ! {Ref, F(A)} end, List) end).

pmap(List, F) ->
Ref = make_ref(),
distribute(List, F, Ref),
gather(erlang:length(List), Ref).


-module(coordinator).
-export([start/1, coordinator/3, reach_server/0]).

start(N) ->
	Pid = spawn(fun() -> coordinator(N, N, []) end),
	register(server, Pid).

reach_server() ->
	Ref = make_ref,
	{server, 'server@127.0.0.1'} ! {serverReached, Ref, self()},
	receive
		{ok, Ref} ->
				io:format("All reached the barrier")
	end.

coordinator(N, 0, List) ->
	[From ! {ok, Ref} || {From, Ref} <- List],
	coordinator(N, N, []);


coordinator(N, M, List) ->
	receive
		{serverReached, Ref, From} ->
			coordinator(N, M-1, List ++ [{From, Ref}])
	end.

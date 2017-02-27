-module(resources).
-export([start/1, request/1, release/1]).

loop(Resources) ->
	AvailResources = erlang:length(Resources),
	receive
		{request, From, Ref, Amount} when Amount =< AvailResources ->
			From ! {ok, Ref, lists:sublist(Resources, Amount)},
			loop(lists:sublist(Resources, Amount, AvailResources));

		{release, Elements} ->
			loop(Resources ++ [Elements])
	end.


start(Init) ->
	Pid = spawn(fun() -> loop(Init) end),
	register(server, Pid).

request(N) ->
	Ref = make_ref(),
	server ! {request, self(), Ref, N},
	receive 
		{ok, Ref, List} ->
		List
	end.

release(List) ->
	server ! {release, List}.
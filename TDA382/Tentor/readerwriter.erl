-module(readerwriter).
-export([start/1]).

%%Reader writer with no fairness

loop(Writers, Readers) ->
	receive
		{writeRequest, From, Ref} when Writers = 0 and Readers = 0 ->
		loop(Writers+1, Readers);

		{readRequest, From, Ref} when Writers = 0 ->
		loop(Writers, Readers+1)
	end.


start() ->
	Pid = spawn(fun() -> loop(0, 0) end),
	register(server, Pid).
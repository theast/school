-module(readerwriter2).
-export([start/0, begin_read/0, end_read/0, begin_write/0, end_write/0, loop/1, loop/0]).

loop() ->
	receive
		{start_read, Ref, From} ->
		From ! {ok_Read, Ref},
		loop(1),
		loop();

		{start_write, Ref, From} ->
		From ! {ok_Write, Ref},
		receive
			stop_Write -> loop()
		end
end.

loop(Readers) ->
receive
	{start_read, Ref, From} ->
		From ! {ok_Read, Ref},
		loop(Readers+1);

	end_read -> loop(Readers-1);

	{start_write, Ref, From} ->
	[ receive end_read -> ok end || _ <- lists:seq(1,Readers) ],
	From ! {ok_Write, Ref},
	receive
		stop_Write -> ok
	end
end.

start() ->
	Pid = spawn(fun() -> loop() end),
	register(server, Pid).

begin_read() ->
	Ref = make_ref(),
	{server, 'server@127.0.0.1'} ! {start_read, Ref, self()},
	receive
		{ok_Read, Ref} -> ok
	end.

end_read() ->
	{server, 'server@127.0.0.1'} ! end_read.

begin_write() ->
	Ref = make_ref(),
	{server, 'server@127.0.0.1'} ! {start_write, Ref, self()},
	receive 
		{ok_Write, Ref} -> ok
	end.

end_write() ->
	{server, 'server@127.0.0.1'} ! stop_Write.

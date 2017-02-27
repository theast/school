-module(factorial).
-export([factorial/2, start/0, serverloop/2, initial_state/0]).
-record(server, {count, log}).

factorial (0, Acc) -> Acc;
factorial (N, Acc) -> factorial(N-1, Acc*N).

start() ->
    Pid = spawn(fun() -> serverloop(initial_state(),  fun serverloop/2) end),
    register(server, Pid).

serverloop(State, {factorial, N}) ->
	io:format("Factorial: ~p~n", [factorial(N, 1)]),
	server ! {request, {addLog, {factorial, N}}},
	{ok, State};

serverloop(State = #server{log = Log}, {addLog, Msg}) ->
	io:format("Added to log: ~p~n", [Msg]),
	{ok, State#server{log = Log ++ [Msg]}};

serverloop(State = #server{log = Log}, printLog) ->
	io:format("The log contains: ~p~n", [Log]),
	{ok, State};

serverloop(State, F) ->
	receive
		{request, Data} ->
			case catch (F(State, Data)) of
				{ok, NewState} ->
				serverloop(NewState, F);

				_ ->
				io:format("Unidentified request.")
			end;

		stop -> 
			io:format("Server is off.~n");

		 _ ->
            io:format("Unidentified command.~n"),
            serverloop(State, F)
	end.

initial_state() ->
  #server{count = 0, log = []}.
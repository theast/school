-module(mathserver).
-export([start/0, compute_factorial/2, factorial/2]).

engine(Count, {factorial,N}) ->
    Result = factorial(N, 1),
    {Result, Count+1} ;

engine(Count, get_count) ->
    {Count, Count}.

start() ->
    genserver:start(server, 0, fun engine/2).

compute_factorial(Pid, N) ->
    genserver:request(Pid, {factorial, N}).

factorial (0, Acc) -> Acc;
factorial (N, Acc) -> factorial(N-1, Acc*N).
	
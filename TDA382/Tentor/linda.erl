-module(linda).
-export([]).

new() ->
	Pid = spawn(fun() -> loop([], []) end),
	register(server, Pid).

loop(Ts, Ps) ->
	receive
		{in, Ref, From, Pattern} ->
			case find(Pattern, Ts) of
				{value, T, OtherTuples} ->
					From ! {result, Ref, T},
					loop(OtherTuples, Ps);
				nix ->
					loop(Ts, Ps ++ [{From, Ref, Pattern}])
			end;

		{out, Tuple} ->
			case checkTuples(Ps, Tuple, []) of
				{sent, NewPs} -> loop(Ts, NewPs);
				nix ->	loop(Ts++[Tuple], Ps)
	end.

checkTuples([], _, _) -> nix;

checkTuples([P={From, Ref, Pattern}|Ps], Tuple, Acc) ->
	case match(Pattern, Tuple) ->
		true -> 
			From ! {result, Ref, Tuple},
			{sent, Acc++Ps};
		false ->
			checkTuples(Ps, Tuple, Acc++[P])
	end.


in(Ts, Pattern) ->
	Ref = make_ref(),
	Ts ! {in, Ref, self(), Pattern},
	receive 
		{result, Ref, Tuple} ->
		Tuple
	end.


out(Ts, Tuple) ->
Ts ! {out, Tuple}.
-module(buffer).
-export([new/0, insert/2, get/1]).

buffer(Buffer) ->
	receive
		{insert, Ref, From, Element} ->
			From ! {ok, Ref},
			buffer(Buffer ++ [Element]);

		{get, Ref, From} ->
			[X|XS] = Buffer,
			From ! {ok, Ref, X},
			buffer(XS)
	end.

insert(Buffer, Element) ->
	Ref = make_ref(),
	Buffer ! {insert, Ref, self(), Element},
	receive 
		{ok, Ref} -> io:format("Inserted element")
	end.

get(Buffer) ->
	Ref = make_ref(),
	Buffer ! {get, Ref, self()},
	receive
		{ok, Ref, Element} -> Element
	end.

new() ->
	Pid = spawn(fun() -> buffer([]) end),
	register(buffer, Pid).
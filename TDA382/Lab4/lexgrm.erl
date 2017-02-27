-module(lexgrm).
-export([  start/0 
         , parse_cmd/1
       ]). 


start() ->
    %% Generation of lexer and parser
    leex:file(lex),
    compile:file(lex),
    yecc:file(grm),
    compile:file(grm),
    ok.
    
%% Making a parser of the command line.
%% It returns: 
%%              {msg, String} 
%%              {connect, Server}
%%              {join, Channel}
%%              ignore
%%
%% The token ignore is used to avoid sending a failed command
%% as a message. 
parse_cmd(Line) ->
    case lex:string(Line) of 
         {error,_, _}       -> tried_a_cmd(Line) ;

         {ok, Tokens, _} -> 
               case grm:parse(Tokens) of                   
                    {ok, Cmd}  -> Cmd ;      
                    {error,_}  -> tried_a_cmd(Tokens,Line) 
               end 
     end.

tried_a_cmd(Line) ->
    case string:str(string:strip(Line),"/") of 
        1 -> {ignore, Line} ;
        _ -> {msg, Line}
    end.             

tried_a_cmd([{'/connect',_,_} | _],Line) -> {ignore,Line} ;
tried_a_cmd([{'/join',_,_} | _],Line) -> {ignore,Line} ; 
tried_a_cmd([{'/nick',_,_} | _],Line) -> {ignore,Line} ; 
tried_a_cmd([{'/whoiam',_,_} | _],Line) -> {ignore,Line} ; 
tried_a_cmd(_,Line) -> {msg, Line}.

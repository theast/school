-module(client).
-export([loop/2, initial_state/2, user/2, decompose_msg/1]).
-include_lib("./defs.hrl").

%%%%%%%%%%%%%%%%%%%%%%%
%%%% Connect to a node
%%%%%%%%%%%%%%%%%%%%%%%
loop(St = #cl_st{nick = Nick}, {connect, {Server, Machine}}) ->
  case catch(genserver:request({list_to_atom(Server), list_to_atom(Machine)}, {connect, Nick, self(), St, list_to_atom(Machine)})) of
    {'EXIT', _} ->
      {{error, server_not_reached, atom_to_list(server_not_reached)}, St};
    
    ok ->
      {ok, St#cl_st{server = {list_to_atom(Server), list_to_atom(Machine)}, machine = list_to_atom(Machine)}};
    
    {error, Reason} ->
      {{error, Reason, atom_to_list(Reason)}, St}
  end;

%%%%%%%%%%%%%%%
%%%% Disconnect
%%%%%%%%%%%%%%%
% Calls genserver:request with the Server converted to an atom and the call,
% {disconnect, Nick, NumberOfChannels}. If it receives ok the method updates the client state.
loop(St = #cl_st{nick = Nick, server = Server, numberOfChannels = NoChannels}, disconnect) ->
  case catch(genserver:request(Server, {disconnect, Nick, NoChannels})) of
        {'EXIT', _} ->
          {{error, user_not_connected, atom_to_list(user_not_connected)}, St};
        
        ok ->   
          {ok, St#cl_st{server = noServer, machine = noMachine}};
        
        {error, Reason} ->
          {{error, Reason, atom_to_list(Reason)}, St}
  end;

%%%%%%%%%%%%%%
%%% Join
%%%%%%%%%%%%%%
% Calls genserver:request with the Server converted to an atom and the call,
% {join, Nick, ChannelAtom}. If it receives ok the method increments the numberOfChannels.
loop(St = #cl_st{nick = Nick, server = Server, numberOfChannels = NoChannels, machine = Machine}, {join, Channel}) ->
  case catch(genserver:request(Server, {join, Nick, list_to_atom(Channel), Machine})) of
    {'EXIT', _} ->
      {{error, server_not_reached, atom_to_list(server_not_reached)}, St};
    
    ok ->
      {ok, St#cl_st{numberOfChannels = NoChannels+1}};
    
    {error, Reason} ->
      {{error, Reason, atom_to_list(Reason)}, St}
  end;

%%%%%%%%%%%%%%%
%%%% Leave
%%%%%%%%%%%%%%%
% Calls genserver:request with the Channel converted to an atom and the call,
% {leave, Nick}. If it receives ok the method decrements the numberOfChannels.
loop(St = #cl_st{nick = Nick, numberOfChannels = NoChannels, machine = Machine}, {leave, Channel}) ->
  case catch(genserver:request({list_to_atom(Channel), Machine}, {leave, Nick})) of
    {'EXIT', _} ->
      {{error, server_not_reached, atom_to_list(server_not_reached)}, St};
    
    ok ->   
      {ok, St#cl_st{numberOfChannels = NoChannels-1}};
    
    {error, Reason} ->
      {{error, Reason, atom_to_list(Reason)}, St}
  end;

%%%%%%%%%%%%%%%%%%%%%
%%% Sending messages
%%%%%%%%%%%%%%%%%%%%%
% Calls genserver:request with the Channel converted to an atom and the call,
% {msg_from_GUI, Nick, Msg}.
loop(St = #cl_st{nick = Nick, machine = Machine}, {msg_from_GUI, Channel, Msg}) ->
  case catch(genserver:request({list_to_atom(Channel), Machine}, {msg_from_GUI, Nick, Msg, Machine})) of
    {'EXIT', _} ->
      {{error, server_not_reached, atom_to_list(server_not_reached)}, St};
    
    ok ->   
      {ok, St};
    
    {error, Reason} ->
      {{error, Reason, atom_to_list(Reason)}, St}
  end;

%%%%%%%%%%%%%%
%%% WhoIam
%%%%%%%%%%%%%%
% Converts the nick atom to a list and then returns it.
loop(St = #cl_st {nick = Nick}, whoiam) ->
  {atom_to_list(Nick), St};

%%%%%%%%%%
%%% Nick
%%%%%%%%%%
% Makes sure that it's only possible to change nick while disconnected.
loop(St = #cl_st{server = Server}, {nick, Nick}) ->
  case catch(genserver:request(Server, {nick, Nick})) of
    {'EXIT', _} ->
      {ok, St#cl_st{nick = list_to_atom(Nick)}};
    
    ok -> 
      {ok, St};  
    
    {error, Reason} ->
      {{error, Reason, atom_to_list(Reason)}, St}
  end;

%%%%%%%%%%%%%
%%% Debug
%%%%%%%%%%%%%
loop(St, debug) ->
  {St, St} ;

%%%%%%%%%%%%%%%%%%%%%
%%%% Incoming message
%%%%%%%%%%%%%%%%%%%%%
% Receives content, and prints it into the appropriate channel.
loop(St = #cl_st { gui = GUIName }, {msg, Content}) ->
  io:format("random"),
  {Channel, Name, Msg} = decompose_msg(Content),
  gen_server:call(list_to_atom(GUIName), {msg_to_GUI, atom_to_list(Channel), atom_to_list(Name)++"> "++Msg}),
  {ok, St}.

% This function will take a message from the client and
% decomposed in the parts needed to tell the GUI to display
% it in the right chat room.
decompose_msg(Content) ->
  case Content of
  {Channel, Name, Msg} ->
    {Channel, Name, Msg}
  end.

%%%%%%%%%%%%%%%%%%%%%
%%%% User
%%%%%%%%%%%%%%%%%%%%%
% Contains a receive loop, receives either stop or some Content.
% If it receives stop, we end the loop.
% If it receives some content, we do a request to genserver of the content.
user({Pid, Machine}, State) ->
  receive
    stop ->
      true;
    
    Content ->
      case catch(genserver:request(Pid, Content)) of
        {'EXIT', _} ->
          {{error, server_not_reached, atom_to_list(server_not_reached)}, State};
        
        ok ->
          user({Pid, Machine}, State);

        {error, Reason} ->
          {{error, Reason, atom_to_list(Reason)}, State}
      end
  end.

initial_state(Nick, GUIName) ->
  #cl_st{ gui = GUIName, server = noServer, nick = list_to_atom(Nick), numberOfChannels = 0}.

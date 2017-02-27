-module(server).
-export([initial_channel_state/2, loop/2, initial_state/1, sendmsg/5]).
-include_lib("./defs.hrl").

% Checks if the nick exists in the list of users, if that's the case
% the method returns an error, else it spawns a "user loop" and register 
% the nick with the pid, and adds the nick to list of users.
loop(St = #server_st{users = Users}, {connect, Nick, Pid, State, Machine}) ->

  case lists:member(Nick, Users) of
    true ->  
      {{error, user_already_connected}, St};

    false -> 
      UserPid = spawn(fun () -> client:user({Pid, Machine}, State) end),
      register(Nick, UserPid),
      {ok, St#server_st{users = lists:append([Nick], Users)}}
  end;

% Checks if the number of channels the user is connected to is > 0,
% if that's case then the method returns an error, else we send
% a message to the "user loop" to stop and unregister the nick.
% We also remove the nick from the list of users.
loop(St = #server_st{users = Users}, {disconnect, Nick, NoChannels}) ->
      case NoChannels > 0 of
        true ->
          {{error, leave_channels_first}, St};

        false ->
          Nick ! stop,
          unregister(Nick),
          {ok, St#server_st{users = lists:delete(Nick, Users)}}
      end;

% Checks if the channel already exists, if it already exists, then
% we make a call to genserver with the ChannelAtom and {join_channel, Nick}.
% Otherwise we call genserver:start which "starts" a new channel, we also
% add the channel to the list of channels.
loop(St = #server_st{channels = Channels}, {join, Nick, Channel, Machine}) ->
  case lists:member(Channel, Channels) of 
    true -> 
      case catch(genserver:request({Channel, Machine}, {join_channel, Nick})) of
        ok ->   
          {ok, St};
        {error, Reason} ->
          {{error, Reason}, St}
      end;

    false -> 
      genserver:start(Channel, initial_channel_state(Channel, Nick), fun loop/2),
      {ok, St#server_st{channels = lists:append([Channel], Channels)}}
  end;

% Checks if the nick is in the list of users, if it does we return nick_taken
% otherwise we return nick_change_error.
loop(St = #server_st{users = Users}, {nick, Nick}) ->
  case lists:member(Nick, Users) of
    true -> 
      {{error, nick_taken}, St};

    false -> 
      {{error, nick_change_error}, St}
  end;

% Checks if the nick is in the list of Users if so we return
% user_already_joined, otherwise we add the nick to the list
% of users.
loop(St = #channel_st{users = Users}, {join_channel, Nick}) ->
  case lists:member(Nick, Users) of
    true ->      
      {{error, user_already_joined}, St};
    
    false ->
      {ok, St#channel_st{users = lists:append([Nick], Users)}}
  end;


% Checks if the nick is in the list of Users if so, we delete
% the nick from the list of users otherwise we return 
% user_not_joined.
loop(St = #channel_st{users = Users}, {leave, Nick}) ->
  case lists:member(Nick, Users) of
    true ->
      {ok, St#channel_st{users = lists:delete(Nick, Users)}};

    false ->
      {{error, user_not_joined}, St}
  end;

% Checks if the nick is in the list of Users if it's not we return
% user_not_joined, otherwise we create a list of all users except
% the one who's sending the message, and then we send the message
% to all the users in the new list. 
loop(St = #channel_st{users = Users, channelName = ChannelName}, {msg_from_GUI, Nick, Msg, Machine}) ->
  case lists:member(Nick, Users) of
    true ->
        OtherUsers = lists:delete(Nick, Users),
        spawn(fun() -> lists:foreach(fun(P) -> spawn(fun () -> sendmsg(P, ChannelName, Nick, Msg, Machine) end) end, OtherUsers) end),
        % Before: [UserPid ! {msg, {ChannelName, Nick, Msg}} | UserPid <- OtherUsers]
        {ok, St};

    false ->
      {{error, user_not_joined}, St}
  end.

  sendmsg (UserPid, ChannelName, Nick, Msg, Machine) ->
  spawn(fun() -> {UserPid, Machine} ! {msg, {ChannelName, Nick, Msg}} end).

% The channel state has a channel name and a list of users.
initial_channel_state(ChannelName, Nick) ->
  #channel_st{channelName = ChannelName, users = [Nick]}.

initial_state(_Server) ->
  #server_st{users = [], channels = []}.


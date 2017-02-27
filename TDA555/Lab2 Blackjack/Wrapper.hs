module Wrapper where

import Data.Char
import System.Random
import Cards

-- The interface to the students' implementation.

data Interface = Interface
  { iEmpty    :: Hand
  , iFullDeck :: Hand
  , iValue    :: Hand -> Integer
  , iGameOver :: Hand -> Bool
  , iWinner   :: Hand -> Hand -> Player
  , iDraw     :: Hand -> Hand -> (Hand, Hand)
  , iPlayBank :: Hand -> Hand -> (Hand, Hand)
-- iPlayBank is modified here
  , iShuffle  :: StdGen -> Hand -> Hand
  }

-- A type of players.

data Player = Guest | Bank
              deriving (Show, Eq)

-- Runs a game given an implementation of the interface.

runGame :: Interface -> IO ()
runGame i = do
  putStrLn "\nWelcome to the game."
  g <- newStdGen
  initGame i (iShuffle i g (iFullDeck i)) (iEmpty i) (iEmpty i)
  
--Gives both the guest and the bank two cards
-- and checks if either of them has Blackjack
initGame :: Interface -> Hand -> Hand -> Hand -> IO()
initGame i deck guest bank = do
  let (deck', guest') = iDraw i deck guest
  let (deck'', bank') = iDraw i deck' bank
  let (deck''', guest'') = iDraw i deck'' guest'
  let (deck'''', bank'') = iDraw i deck''' bank'
  let bBlackjack = (iValue i bank'') == 21
  let gBlackjack = (iValue i guest'') == 21
  if bBlackjack && gBlackjack then do
    putStrLn "Both the bank and the guest has Blackjack, it's a tie."
    putStrLn "Winner: None"
   else do
    if bBlackjack then do
      putStrLn "The bank has Blackjack!"
      putStrLn ("The bank's final hand: " ++ showHand bank'')
      putStrLn ("Winner: " ++ show (iWinner i guest'' bank''))
     else
      if gBlackjack then do
        putStrLn "The guest has Blackjack!"
        putStrLn ("Your final hand: " ++ showHand guest'')
        putStrLn ("Winner: " ++ show (iWinner i guest'' bank''))
  	 else do
        let (Some card _) = bank''
        putStrLn ("The bank shows you a " ++ showCard card)
        putStrLn "Neither of you have Blackjack.\n"
        gameLoop i deck'''' guest'' bank''

--card.toString()
showCard :: Card -> String
showCard (Card (Numeric value) suit) = show value ++ " of " ++ show suit
showCard (Card value suit) = show value ++ " of " ++ show suit

--hand.toString()
showHand :: Hand -> String
showHand Empty = "Empty"
showHand (Some card Empty) = showCard card
showHand (Some card hand) = showCard card ++ ", " ++ showHand hand
  
-- Play until the guest player is bust or chooses to stop.

gameLoop :: Interface -> Hand -> Hand -> Hand -> IO ()
gameLoop i deck guest bank = do
  putStrLn ("Your current hand: " ++ showHand guest)
  putStrLn ("Your current score: " ++ show (iValue i guest))
  if iGameOver i guest then do
    finish i deck guest bank
   else do
    putStrLn "Draw another card? [y]"
    yn <- getLine
    if null yn || not (map toLower yn == "n") then do
      let (deck', guest') = iDraw i deck guest
      gameLoop i deck' guest' bank
     else
      finish i deck guest bank

-- Display the bank's final score and the winner.
-- Modified for a more dynamic finish

finish :: Interface -> Hand -> Hand -> Hand -> IO ()
finish i deck guest bank = do
  if iGameOver i guest then do
    putStrLn "You are bust!"
    putStrLn ("Winner: " ++ show (iWinner i guest bank))
   else do
    let (deck', bank') = iPlayBank i deck bank
    putStrLn ("The bank's final hand: " ++ showHand bank')
    putStrLn ("The bank's final score: " ++ show (iValue i bank'))
    if iGameOver i bank' then do
      putStrLn "The bank is bust!"
      putStrLn ("Winner: " ++ show (iWinner i guest bank'))
     else
      putStrLn ("Winner: " ++ show (iWinner i guest bank'))

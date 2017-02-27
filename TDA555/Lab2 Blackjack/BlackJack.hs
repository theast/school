module BlackJack where

import Cards
import Wrapper
import Test.QuickCheck
import System.Random

main :: IO()
main = runGame implementation

implementation = Interface
  {iEmpty    = empty
  ,iFullDeck = fullDeck
  ,iValue    = value
  ,iGameOver = gameOver
  ,iWinner   = winner
  ,iDraw     = draw
  ,iPlayBank = playBank
  ,iShuffle  = shuffle
  }

--Isn't this a bit redundant?
--Why not just write Empty when you want an empty hand?
empty :: Hand
empty = Empty

--Top level function. Calculates the "raw" value and then 
-- adjusts it through the _value function
value :: Hand -> Integer
value hand
  | v > 21 = v - (numOfAces hand * 10)
  | otherwise = v
    where v = value' hand

--Recursive function that calculates the "raw" value of a hand
value' :: Hand -> Integer
value' Empty = 0
value' (Some card hand) = valueCard card + value' hand

--Gets the value of a single card
valueCard :: Card -> Integer
valueCard (Card rank _) = valueRank rank

--Converts a rank to a value
valueRank :: Rank -> Integer
valueRank (Numeric rank)
  | rank >= 2 && rank <= 10 = rank
  | otherwise = error ("valueRank: invalid rank (" ++ show rank ++ ")")
valueRank Jack = 10
valueRank Queen = 10
valueRank King = 10
valueRank Ace = 11

--Calculates the number of aces in a hand
numOfAces :: Hand -> Integer
numOfAces Empty = 0
numOfAces (Some (Card Ace _) hand) = 1 + numOfAces hand
numOfAces (Some _ hand) = numOfAces hand

--Is the player bust?
gameOver :: Hand -> Bool
gameOver hand = value hand > 21

--Which hand wins?
winner :: Hand -> Hand -> Player
winner guest bank
  | gameOver guest           = Bank
  | gameOver bank            = Guest
  | value guest > value bank = Guest
  | otherwise                = Bank

--Puts the first hand on top of the second hand.
(<+) :: Hand -> Hand -> Hand
(<+) Empty hand2 = hand2
(<+) (Some card1 hand1) hand2 = Some card1 (hand1 <+ hand2)

--Checks if the (<+) operator is associative
prop_onTopOf_assoc :: Hand -> Hand -> Hand -> Bool
prop_onTopOf_assoc hand1 hand2 hand3 = 
  (hand1 <+ (hand2 <+ hand3)) == ((hand1 <+ hand2) <+ hand3)

--Checks if the size of the two hands combined
-- equals the sum of the two hands' sizes individually
prop_size_onTopOf :: Hand -> Hand -> Bool
prop_size_onTopOf hand1 hand2 = 
  size hand1 + size hand2 == size (hand1 <+ hand2)

--Creates all four suits and combines them
fullDeck :: Hand
fullDeck = fullSuit Spades <+ fullSuit Hearts 
  <+ fullSuit Diamonds <+ fullSuit Clubs

-- Create all 13 cards of a given suit
fullSuit :: Suit -> Hand
fullSuit suit = fullSuit' suit 2 Empty

--The recursive function for creating the cards
fullSuit' :: Suit -> Integer -> Hand -> Hand
fullSuit' suit n hand
  | n > 1 && n <= 10 = fullSuit' suit (n+1) (Some (Card (Numeric n) suit) hand)
  | n == 11          = fullSuit' suit (n+1) (Some (Card Jack suit) hand)
  | n == 12          = fullSuit' suit (n+1) (Some (Card Queen suit) hand)
  | n == 13          = fullSuit' suit (n+1) (Some (Card King suit) hand)
  | n == 14          = fullSuit' suit (n+1) (Some (Card Ace suit) hand)
  | otherwise        = hand

--Draws a card from the deck and puts it in the hand
--      deck    hand     deck  hand
draw :: Hand -> Hand -> (Hand, Hand)
draw Empty _ = error "draw: The deck is empty"
draw (Some cardFromDeck restOfDeck) hand = 
  (restOfDeck, (Some cardFromDeck hand))

--Play algorithm for the bank
--This is not according to the lab description since we've modified
-- the Wrapper module
--Instead of taking the deck and returning the bank's hand
-- it takes the deck, the bank's hand (consiting of two cards)
-- and return the new deck and the bank's final hand
playBank :: Hand -> Hand -> (Hand, Hand)
playBank deck bank
  | value bank >= 16 = (deck, bank)
  | otherwise = do
    let (deck', bank') = draw deck bank
    playBank deck' bank'

--Top level shuffle function
shuffle :: StdGen -> Hand -> Hand
shuffle gen hand = shuffle' gen hand Empty

--Help function for shuffle.
--Takes a generator, a hand to draw random cards from 
-- and a hand to put the random cards in
shuffle' :: StdGen -> Hand -> Hand -> Hand
shuffle' _ Empty endHand = endHand
shuffle' gen orgHand endHand = shuffle' newGen newHand (Some rCard endHand)
  where (rInt, newGen) = randomR (0, (size orgHand)-1) gen
        (rCard, newHand) = drawNthCard rInt orgHand

--Top level function which draws the nth card from a hand
drawNthCard :: Integer -> Hand -> (Card, Hand)
drawNthCard n orgHand = drawNthCard' n orgHand Empty

--Help function. 
--Takes which card you'd like to draw, a hand to draw from
-- and a hand with all the cards that you didn't want
--While n > 0 take the top card from the first hand, put it
-- in the second hand and decrease n by 1
--When n == 0 return the top card from the first hand
-- and combine the rest of the first hand with the cards
-- that you didn't want. Note: To keep the order of the
-- returned hand, reverse the "skip hand"
drawNthCard' :: Integer -> Hand -> Hand -> (Card, Hand)
drawNthCard' n hand _
  | n < 0 || n >= size hand = 
    error ("drawNthCard: Nth card doesn't exist (" ++ show n ++ ")")
drawNthCard' n (Some card restHand) skipHand
  | n == 0    = (card, (reverseHand skipHand) <+ restHand)
  | otherwise = drawNthCard' (n-1) restHand (Some card skipHand)

--Reverse a hand
reverseHand :: Hand -> Hand
reverseHand hand = reverseHand' hand Empty

--Help function. Goes though the entire hand and puts the top card
-- of the first hand on top of the second hand, effectivly reversing it.
reverseHand' :: Hand -> Hand -> Hand
reverseHand' Empty hand = hand
reverseHand' (Some card oldHand) newHand =
  reverseHand' oldHand (Some card newHand)

--Checks if a card belongs to both the original hand and the shuffled hand
prop_shuffle_sameCards :: StdGen -> Card -> Hand -> Bool
prop_shuffle_sameCards g c h = belongsTo c h == belongsTo c (shuffle g h)

--Does this card belong to this hand?
belongsTo :: Card -> Hand -> Bool
belongsTo _ Empty = False
belongsTo c1 (Some c2 h) = c1 == c2 || belongsTo c1 h

--Checks if shuffle doesn't tamper with the size of the hand
prop_size_shuffle :: StdGen -> Hand -> Bool
prop_size_shuffle g h = size h == size (shuffle g h)

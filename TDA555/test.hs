import Test.QuickCheck
import Data.Maybe

--1
look :: Eq a => a -> [(a, b)] -> Maybe b
look x [] = Nothing
look x ((x', y) : xys)
  | x == x' = Just y
  | otherwise = look x xys
  
prop_LookNothing :: Eq a => Eq b => a -> [(a, b)] -> Property
prop_LookNothing x xys = look x xys == Nothing ==> not (elem x (map fst xys))

prop_LookJust :: Eq a => Eq b => a -> [(a, b)] -> Property
prop_LookJust x xys = not (el == Nothing) ==> elem (x, fromJust el) xys
  where el = look x xys
  
prop_Look :: Eq a => Eq b => a -> [(a, b)] -> Property
prop_Look x xys = prop_LookNothing x xys .&. prop_LookJust x xys

--3
game :: IO ()
game = do
  putStrLn "Think of a number between 1 and 100!"
  putStrLn "Use \"higher\", \"lower\" or \"yes\""
  gameLoop 1 100

gameLoop :: Integral a => a -> a -> IO ()
gameLoop min max = do
  let mid = min + (div (max - min) 2)
  putStr ("Is it " ++ show mid ++ "? ")
  input <- getLine
  if input == "higher" then
    gameLoop mid max
  else if input == "lower" then
    gameLoop min mid
  else if input == "yes" then
    putStrLn "Great, I won!"
  else
    error "gameLoop: Invalid input"

listOfLength :: Integer -> Gen a -> Gen [a]
listOfLength 0 _ = return []
listOfLength n g = do
  el <- g
  list <- listOfLength (n-1) g
  return (el : list)
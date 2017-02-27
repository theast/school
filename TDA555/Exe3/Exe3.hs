import List
import Test.QuickCheck

--1
isPermutation :: Ord a => Eq a => [a] -> [a] -> Bool
isPermutation l1 l2 = sort l1 == sort l2

--2
sorted :: Ord a => [a] -> Bool
sorted list = and [list!!x <= list!!(x+1) | x <- [0..((length list)-2)]]

insert' :: Ord a => a -> [a] -> [a]
insert' el xs
  | not (sorted xs) = error "din mamma"
  | otherwise = [x | x <- xs, x < el] ++ [el] ++ [x | x <- xs, x >= el]

insert'' :: Ord a => a -> [a] -> [a]
insert'' el [] = [el]
insert'' el xs
  | not (sorted xs) = error "det var baettre foerr"
  | otherwise = take n xs ++ [el] ++ drop n xs
    where n = head ([x | x <- (0:[1..length xs-1]), el <= xs!!x] ++ [length xs])

prop_insert' :: Integer -> [Integer] -> Property
prop_insert' x xs = sorted xs ==> sorted (insert' x xs)

isort :: Ord a => [a] -> [a]
isort [] = []
isort xs = isort' (head xs) (tail xs) []

isort' :: Ord a => a -> [a] -> [a] -> [a]
isort' el [] dst = insert' el dst
isort' el src dst = isort' (head src) (tail src) (insert' el dst)

prop_isort :: [Integer] -> Bool
prop_isort xs = sorted (isort xs)
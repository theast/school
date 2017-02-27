import Data.List
import System.Random
import Criterion.Main
import Control.Monad.Par
import Control.Parallel
import Control.Parallel.Strategies

asort [] = []
asort (x:xs) = asort [y | y <- xs, y<x]
                ++ [x]
                ++ asort [y | y <- xs, y>=x]

qsort _ [] = []
qsort 0 xs = asort xs
qsort n (x:xs) = par x' (pseq x'' (x' ++ [x] ++ x''))
    where
        x' = qsort (n-1) [y | y <- xs, y < x]
        x'' = qsort (n-1) [y | y <- xs, y >= x]

parMapMonad :: NFData b => (a -> Par b) -> [a] -> Par [b]
parMapMonad f [x] = do
    a <- f x
    return [a]
parMapMonad f as = do
    let (left, right) = splitarr(as)
    x <- spawn(parMapMonad f left)
    y <- spawn(parMapMonad f right)
    x' <- get x
    y' <- get y
    return (x' ++ y')   
 
splitarr :: [a] -> ([a], [a])
splitarr [] = ([], [])
splitarr [x] = ([x], [])
splitarr xs = splitAt (((length xs) + 1) `div` 2) xs

mergesort :: (NFData a, Ord a) => [a] -> Par [a]
mergesort [] = return []
mergesort [x] = return [x]
mergesort xs = do
    let (left, right) = splitarr xs
    listA <- (parMapM mergesort [left, right])
    let m1 = head listA
    let m2 = last listA
    let res = merge m1 m2
    return res

merge :: Ord a => [a] -> [a] -> [a]
merge xs [] = xs
merge [] ys = ys
merge (x:xs) (y:ys) = if x < y
                      then x:(merge xs (y:ys))
                      else y:(merge (x:xs) ys)

merge_sort [] = []
merge_sort [x] = [x]
merge_sort xs = merge (merge_sort ys) (merge_sort zs)
    where (ys,zs) = splitarr xs

par_merge_sort :: Ord a => Int -> [a] -> [a]
par_merge_sort _ [] = []
par_merge_sort _ [x] = [x]
par_merge_sort 0 xs = merge (par_merge_sort 0 ys) (par_merge_sort 0 zs)
    where 
        (ys,zs) = splitarr xs
par_merge_sort d xs = left `par`(right `pseq` merge left right)
    where 
        (ys,zs) = splitarr xs
        left = par_merge_sort (d-1) ys
        right = par_merge_sort (d-1) zs

randomInts =
 take 200000 (randoms (mkStdGen 211570155))
 :: [Integer]

isOrdered :: Ord a => [a] -> Bool
isOrdered (x:y:xs) | x<=y = isOrdered (y:xs)
                   | otherwise = False
isOrdered _ = True

parFoldM :: NFData a => (a -> a -> Par a) -> [a] -> Par a 
parFoldM _ [x] = return x
parFoldM f [x, y] = f x y
parFoldM f (x:y:ys) = do
    a <- spawn $ parFoldM f ys
    b <- f x y
    c <- get a
    f b c

main = defaultMain
        [bench "qsort" (nf asort randomInts),
     bench "parqsort" (nf (qsort 3) randomInts),
     bench "par mergesort" (nf (par_merge_sort 2) randomInts),
     bench "mergesort" (nf merge_sort randomInts),
     bench "Monad mergesort" (nf runPar (mergesort randomInts))]

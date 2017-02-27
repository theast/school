import System.Random
import Control.Parallel
import Control.Parallel.Strategies
import Control.Monad.Par

m1 :: Ord a => Int -> [a] -> [a]
m1 _ [] = []
m1 _ [x] = [x]
m1 n xs 
    | n > 0 = (force eLeft) `par` (force eRight) `pseq` merge eLeft eRight
    | otherwise = merge eLeft eRight
     where
    (left, right) = splitarr xs
    eLeft = m1 (n-1) left
    eRight = m1 (n-1) right

force :: [a] -> ()
force [] = ()
force (x:xs) = x `pseq` force xs

m2 :: (Ord a) => Int -> [a] -> [a]
m2 _ [] = []
m2 _ [x] = [x]
m2 n xs 
   | n > 0 = runEval (strat (merge eLeft eRight)) 
   | otherwise = merge eLeft eRight 
    where 
        (left, right) = splitarr xs
        eLeft = m2 (n-1) left
        eRight = m2 (n-1) right    
        strat v = do rpar (force eLeft); rseq (force eRight); return v

mergesort :: Ord a => [a] -> [a]
mergesort [] = []
mergesort [x] = [x]
mergesort xs = merge eLeft eRight
    where
    (left, right) = splitarr xs
    eLeft = mergesort left
    eRight = mergesort right

splitarr :: [a] -> ([a], [a])
splitarr [] = ([], [])
splitarr [x] = ([x], [])
splitarr xs = splitAt (((length xs) + 1) `div` 2) xs

merge :: Ord a => [a] -> [a] -> [a]
merge xs [] = xs
merge [] ys = ys
merge (x:xs) (y:ys) = if x < y
                      then x:(merge xs (y:ys))
                      else y:(merge (x:xs) ys)

isOrdered :: Ord a => [a] -> Bool
isOrdered (x:y:xs) | x<=y = isOrdered (y:xs)
                   | otherwise = False
isOrdered _ = True

main :: IO()
main = do
    let a = take 999999 (randoms (mkStdGen 211570155)) :: [Int]
    let b = m1 2 a
    putStrLn $ show (isOrdered b)

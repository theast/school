import Data.List
import System.Random
import Criterion.Main
import Control.Parallel
import Control.Parallel.Strategies
--import Control.Monad.Par

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

randomInts =
 take 600000 (randoms (mkStdGen 211570155))
 :: [Integer]

main = defaultMain
    [bench "qsort" (nf sort randomInts),
     bench "parqsort" (nf (qsort 3) randomInts)]

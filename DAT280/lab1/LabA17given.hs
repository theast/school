import Data.List
import System.Random
import Criterion.Main
import Control.Parallel
import Control.Parallel.Strategies
--import Control.Monad.Par

-- code borrowed from the Stanford Course 240h (Functional Systems in Haskell)
-- I suspect it comes from Bryan O'Sullivan, author of Criterion

data T a = T !a !Int


mean :: (RealFrac a) => [a] -> a
mean = fini . foldl' go (T 0 0)
  where
    fini (T a _) = a
    go (T m n) x = T m' n'
      where m' = m + (x - m) / fromIntegral n'
            n' = n + 1


resamples :: Int -> [a] -> [[a]]
resamples k xs =
    take (length xs - k) $
    zipWith (++) (inits xs) (map (drop k) (tails xs))


--jackknife :: NFData b => ([a] -> b) -> [a] -> [b]
jackknife :: ([a] -> b) -> [a] -> [b]
--jackknife f = map f. resamples 500
jackknife f = parMap f . resamples 500 
--jackknife f = pMap f . resamples 500
--jackknife f = runEval . rparMap f . resamples 500
--jackknife f = rparstratMap f . resamples 500
--jackknife f = runPar . pmonadMap f . resamples 500

pMap :: (a -> b) -> [a] -> [b]
pMap f [] = []        
pMap f (x:xs) = fx `par` fxs `pseq` (fx:fxs) 
    where
        fx = f x
        fxs = pMap f xs

rparMap :: (a -> b) -> [a] -> Eval [b]
rparMap f [] = return []
rparMap f (x:xs) =  do
    x' <- rpar (f x) 
    xs' <- rparMap f xs
    rseq xs'
    return (x':xs')

rparstratMap :: (a -> b) -> [a] -> [b]
rparstratMap f [] = []
rparstratMap f (x:xs) = withStrategy strat (x':xs')
    where
        x' = f x
        xs' = rparstratMap f xs
        strat v = do rpar x'; rseq xs'; return v

--pmonadMap :: NFData b => (a -> b) -> [a] -> Par [b]
--pmonadMap f [] = return []
--pmonadMap f (x:xs) =  do
    --v1 <- new
   -- fork $ put v1 (f x)
   -- v2 <- pmonadMap f xs
  --  a <- get v1
--    return (a:v2)

crud = zipWith (\x a -> sin (x / 300)**2 + a) [0..]

main = do
  let (xs,ys) = splitAt 1500  (take 6000
                               (randoms (mkStdGen 211570155)) :: [Float] )
  -- handy (later) to give same input different parallel functions

  let rs = crud xs ++ ys
  putStrLn $ "sample mean:    " ++ show (mean rs)

  let j = jackknife mean rs :: [Float]
  putStrLn $ "jack mean min:  " ++ show (minimum j)
  putStrLn $ "jack mean max:  " ++ show (maximum j)
--  defaultMain
  --      [
    --     bench "jackknife" (nf (jackknife  mean) rs)
      --   ]


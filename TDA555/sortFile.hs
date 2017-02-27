import Data.List

sortFile :: FilePath -> FilePath -> IO ()
sortFile f1 f2 = do
  s1 <- readFile f1
  writeFile f2 (unlines (sort (lines s1)))
import System.IO (stderr, hPutStrLn)
import System.Environment (getArgs)
import LexCpp;import ParCpp;import ErrM
parse s = case pProgram (myLexer s) of
            Bad err  -> hPutStrLn stderr "ERROR" >> hPutStrLn stderr err
            Ok  tree -> hPutStrLn stderr "OK"
main = do [file] <- getArgs
          readFile file >>= parse

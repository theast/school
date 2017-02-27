-- One does not simply use ghci to GUI programmering - USE GHC..
-- Haskell program -> GHC -> objektfil (.o)  
-- ghc --make Apa  <- Skapar fil som är exekverbar..
-- Om man ska exekverar måste man ha en main funktion..
-- main måste vara en IO () -> main :: IO ()
-- initGUI Säger att det kommer komma fönster (varnar OS)


module Main where

import Graphics.UI.Gtk


main :: IO ()
main = do initGUI

        win <- windowNew
        windowSetTitle win "Rear"
        win `onDestroy` mainQuit

        lab <- labelNew Nothing
        ent <- entryNew
        but <- buttonNew
        buttonSetLabel but "Hello"
        but `onClicked` hello lab ent

        box <- vBoxNew False 5
        containerAdd box lab
        containerAdd box ent
        containerAdd box but

        containerAdd win box


        widgetShowAll win 

        mainGUI

hello :: Label -> Entry -> IO ()
hello = do 
	    s <- entryGetText ent
	    labelSetText lab ("Hello, " ++ s ++ "!") 
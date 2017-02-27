all: given

mergesort: mergesort.hs
	ghc -threaded -eventlog -rtsopts -feager-blackholing --make mergesort.hs

given: given.hs
	ghc -threaded -eventlog -rtsopts -feager-blackholing --make given.hs

run-given: given
	./given +RTS -ls -N$(N) $(F)

run-mergesort: mergesort
	./mergesort +RTS -ls -N$(N) $(F)

clean:
	rm -f *.o *.hi

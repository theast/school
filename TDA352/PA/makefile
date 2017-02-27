JAVAC=javac
sources = $(wildcard *.java)
classes = $(sources:.java=.class)

all: $(classes)

clean :
	rm -f *.class

runCryptoLib:
	javac CryptoLib.java
	javac CryptoLibTest.java
	java CryptoLibTest
	make clean

runCBC:
	javac CBCXor.java
	java CBCXor
	make clean

%.class : %.java
	$(JAVAC) $<
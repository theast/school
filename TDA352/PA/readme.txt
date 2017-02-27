For the programming assignments I used my personal number: 199311099114

CBCXor
In this assignment, I had as input the first block of message and the ciphertext. The 12 first bytes of the ciphertext is equivalent to the initialization vector. The remaining consequent of 12 bytes corresponds to a cipher block.

In order to find the key, I would need IV, m[0] and c[0]. Luckily, all of those three was a part of the input I received.
(IV + m[0]) + Key = c[0]
(IV + m[0]) + c[0] = Key

When I figured out the key i could simply rewrite the statement above to find the message:
m[0] = (c[0] + Key) + IV <- The initial message
m[1] = (c[1] + Key) + c[0]
…

CryptoLib

My approach for implementing EEA was simply done by following the instructions in the attached link. Though, i found a special case when a=b. Which results in that:

result[0] = a;
result[1] = 1;
result[2] = 0;

EulerPhi was implemented using my implementation of EEA. I looped from 1 to n and on each value i used EEA. If the greatest common denominator of those two values was 1 I incremented a counter.

ModularInverse
Firstly i calculated the gcd(n, n+m) the reason why i used (n+m) is that it did not worked for negative numbers. If the gcd was equal to 1 a modular inverse exists. If a modular inverse exist i had to calculate it. 

While implementing FermatPt i realized that it required powers of really high numbers. Thus, Java could not manage to compute it using Math.pow. Therefore, I had to implement a power function which also used mod in order to keep the numbers down.

The hash collision probability was firstly implemented using the approximation:

1-e^(-n^2/(2H))

But that approximation was not good enough for the test suite. Therefore, I had to do all the calculations..

N-1/N * N-2/N * … * N-(K-1)/N





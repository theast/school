#include <stdio.h>
#include <stdbool.h>

const char MIN_MORSE_CHAR = 'A', MAX_MORSE_CHAR = 'Z';
const char* morseTable[] = {
	".-",
	"-...",
	"-.-.",
	"-..",
	".",
	"..-.",
	"--.",
	"....",
	"..",
	".---",
	"-.-",
	".-..",
	"--",
	"-.",
	"---",
	".--.",
	"--.-",
	".-.",
	"...",
	"-",
	"..-",
	"...-",
	".--",
	"-..-",
	"-.--",
	"--.."
	};

char sok(char* morse);
char fran_morse(char* morse);

int main(int argc, char **argv) {
	char *rad = malloc(sizeof(char)*256);
	if(!rad) {
		printf("malloc error");
		return -1;
	}
	char c;
	bool fstChar = true;
	while(scanf("%255s", rad) > 0) {
		c = fran_morse(rad);
		if(fstChar)
			fstChar = false;
		else
			c = tolower(c);
		printf("%c", c);
		*rad = getchar();
		if(*rad == '\t')
			printf(" ");
		else if(*rad == '\n')
			break;
	}
	printf("\n");
	free(rad);
	return 0;
}

char sok(char* morse) {
	char ret = 0;
	while(ret < MAX_MORSE_CHAR - MIN_MORSE_CHAR) {
		if(!strcmp(morse, morseTable[ret]))
			return ret;
		ret++;
	}
	return -1;
}

char fran_morse(char* morse) {
	char nr = sok(morse);
	if(nr == -1)
		return '?';
	return nr + MIN_MORSE_CHAR;
}

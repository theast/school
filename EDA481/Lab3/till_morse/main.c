#include <stdio.h>

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
	
char bokst_nr(char c);
char* till_morse(char c);

int main(int argc, char **argv) {
	char *rad = malloc(sizeof(char)*256);
	if(!rad) {
		printf("malloc error");
		return -1;
	}
	char *bokstav;
	while((*rad = getchar()) != '\n') {
		scanf("%254[^\n]", rad+1);
		bokstav = rad;
		while(strlen(bokstav) > 0) {
			if(*bokstav == ' ')
				printf("%c", '\t');
			else {
				printf("%s", till_morse(*bokstav));
				if(*(bokstav+1) != ' ')
					printf(" ");
			}
			bokstav++;
		}
	}
	printf("\n");
	free(rad);
	return 0;
}

char bokst_nr(char c) {
	c = toupper(c);
	if(c < MIN_MORSE_CHAR || c > MAX_MORSE_CHAR)
		return -1;
	return c - MIN_MORSE_CHAR;
}

char* till_morse(char c) {
	char nr = bokst_nr(c);
	if(nr == -1)
		return "";
	return morseTable[nr];
}

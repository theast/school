#include <stdio.h>
#include <string.h>
char*  morseArray[] = {".-", "-...", "-.-.", "-..", ".", "..-.", "--.", "....", "..", ".---", "-.-", ".-..", "--", "-.", "---", ".--.", "--.-", ".-.", "...", "-", "..-", "...-", ".--", "-..-", "-.--", "--.."};
int bokst_nr (char c)
{
	if (c >= 'a' && c <= 'z') {
		return (c-'a');
	} else if (c >= 'A' && c <= 'Z') {
		return (c-'A');
	} else {
		return -1;
	}
}
char * till_morse (char c)
{
	if ((c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z')) {
		return (morseArray[bokst_nr(c)]);
	} else {
		return "";
	}
}
int sok (char* string)
{
	int i = 0;
	for (i; i < 25; i++) {
		if (strcmp(string, morseArray[i]) == 0) {
			return i;
		}
	}
	return -1;
}
char fran_morse (char* string)
{
	if (sok(string) != -1) {
		return (sok(string)+'a');
	}
	return '?';
}
void main(int argc, char **argv)
{
	char inputstring[500];
	char *p;
	p = inputstring;
	gets(inputstring);
	int i = 0 ;
	char temp[6];
	while (*p != '\0') {
		  
		for(i; i < 6; i++) {
			  temp[i]='\0';
		}
		 i=0;
		 while(*p != '\t' && *p != ' ') {
			  temp[i]= *p;
			  i++;
			  p++;
			 
		}
		 i=0;
		 printf("%c", fran_morse(temp));
		 if(*p == '\t') {
			  printf(" ");
		}
		p++;
		 
		 
	}
}
//int main(int argc, char **argv)
//{
//	char morse[500];
//	char inputString[500];
//	char *p;
//	gets(inputString);
//	p=inputString;
//	while (*p != '\0') {
//		if (*p == ' ') {
//			strcat(morse, "\t");
//		} else {
//			strcat(morse, till_morse(*p));
//			strcat(morse, " ");
//		}
//		p++;
//	}
//	printf("%s\n", morse);
//	printf("%c\n", fran_morse("...."));
//	return 0;
//}

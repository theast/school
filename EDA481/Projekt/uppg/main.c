/* 7_6.c */

#include <stdio.h>         /* printf(), gets() */
#include <string.h>        /* strlen()         */

#include <stdlib.h>         /* calloc() */
//#include "7_7.h"          /* calloc() */

#define   MAXLEN 128

char  *GetStr(void)
{
  char      org[MAXLEN+1], *tmp, *copy;
  unsigned  i;

  gets(org);
  copy = (char *) malloc(strlen(org)+1);
  tmp = copy; i = 0;
  while (*tmp++ = org[i++])
    ;

  return copy;
}


int main()   /* Test */
{
  char  *s;

  printf("Skriv in en rad (max %u tkn):\n", MAXLEN);
  s = GetStr();
  printf("\nInmatad rad efter bearbetning:\n%s\n", s);
}


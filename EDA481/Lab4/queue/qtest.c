#include <stdio.h>
#define DATA const char
#include "queue.h"

#ifdef _MSC_VER
#include <crtdbg.h>
#endif // _MSC_VER


void print_queue(Queue q) {
    Iterator it;
    for (it = new_iterator(q); is_valid(it); go_to_next(it)) {
      printf("\"%s\" ", get_current(it));
    }
    printf("\n\n");
    delete_iterator(it);   
}

void print_reverse_queue(Queue q) {
    Iterator it = new_iterator(q);
    go_to_last(it);
    for (; is_valid(it); go_to_previous(it)) {
      printf("\"%s\" ", get_current(it));
    } 
    printf("\n\n"); 
    delete_iterator(it);   
}

#define CHECK_CONDITION(condition, message) if (!(condition)) { printf("%s\n", message); return 1; }

int checkQueue(Queue q, const char *data[], const int order[], int startOffset, int qsize) {
  Iterator it;
  int i = startOffset;
  if (size(q) != qsize) {
    return 0;
  }
  for (it = new_iterator(q); is_valid(it); go_to_next(it), ++i) {
    if (get_current(it) != data[order[i]]) {
      printf("Fel: element %d i kö ska vara \"%s\" men är \"%s\" ", i - startOffset, data[order[i]], get_current(it));
      delete_iterator(it);
      return 0;
    }
    // om vi kommer hit är size inte underhållen på rätt sätt.
    if (i - startOffset >= size(q)) {
      return 0;
    }
  }
  delete_iterator(it);   
  return 1;
}



int main(int argc, char *argv[]) {
    const char *daniel = "Daniel";
    const char *lisa = "Lisa";
    const char *a[] = {"Kalle", "Olle", "Eva", lisa, "Stina", 
                      "Peter", "Anna", daniel, "Johan", "Maria"};
    const int correctOrder1[] = {3, 7, 2, 6, 1, 5, 9, 0, 4, 8 };
    const int correctOrder2[] = {5, 4, 7, 3, 6};
    Queue q = new_queue();
    int i;

    for (i=0; i<10; i++) {
      add(q, i%4, a[i]); 
    }
    printf("Nu skall storleken vara lika med 10 och första element \"%s\":\n", a[3]);
    printf("Storlek = %d\n", size(q));
    CHECK_CONDITION(size(q) == 10, "Nu skall storleken vara lika med 10");
    printf("Första element = \"%s\"\n\n", get_first(q));
    CHECK_CONDITION(get_first(q) == a[3], "Felaktigt första element.");
    printf("Nu skall 10 element skrivas ut: (\"%s\" först och \"%s\" sist)\n", a[3], a[8]);
    print_queue(q); 
    // kolla ordning i kö
    CHECK_CONDITION(checkQueue(q, a, correctOrder1, 0, 10), "");
    printf("Nu skall första elementet vara borttaget:\n");   
    remove_first(q);
    print_queue(q);
    CHECK_CONDITION(size(q) == 9, "Nu skall storleken vara lika med 9");
    CHECK_CONDITION(checkQueue(q, a, correctOrder1, 1, 9), "");
    printf("Nu skall även andra elementet vara borttaget:\n");
    remove_first(q);
    print_queue(q);
    CHECK_CONDITION(size(q) == 8, "Nu skall storleken vara lika med 8");
    CHECK_CONDITION(checkQueue(q, a, correctOrder1, 2, 8), "");
    for (i=1; i<=15; i++)
      remove_first(q);
    printf("Nu skall storleken vara lika med 0 och inga element skall skrivas ut:\n");
    printf("Storlek = %d\n", size(q));
    CHECK_CONDITION(size(q) == 0, "Nu skall storleken vara lika med 0");
    print_queue(q);
    for (i=3; i<8; i++)
      add(q, i%3, a[i]);
    printf("Nu skall storleken vara lika med 5, första element \"%s\" och sista \"%s\":\n", a[5], a[6]);
    printf("Storlek = %d\n", size(q));
    print_queue(q);
    CHECK_CONDITION(size(q) == 5, "Nu skall storleken vara lika med 5");
    CHECK_CONDITION(checkQueue(q, a, correctOrder2, 0, 5), "");
    {
      // hög med iterator test...
      Iterator it = new_iterator(q); 
      // 
      CHECK_CONDITION(is_valid(it), "Fel: nyskapad iterator skall vara första elementet!\n");
      go_to_previous(it);
      CHECK_CONDITION(!is_valid(it), "Fel: go_to_previous från första skall ge invalid iterator!\n");
      CHECK_CONDITION(get_current(it) == 0, "Fel: get_current av invalid iterator ska ge 0!");
      change_current(it, "blahonga");
      CHECK_CONDITION(get_current(it) == 0, "Fel: change_current på invalid iterator ska ej ha effekt!");
      go_to_previous(it);
      CHECK_CONDITION(!is_valid(it), "Fel: go_to_previous ska ej påverka invalid iterator!\n");
      go_to_next(it);
      CHECK_CONDITION(!is_valid(it), "Fel: go_to_next ska ej påverka invalid iterator!\n");
      delete_iterator(it);
    }
    printf("Nu skall kön skrivas ut baklänges:\n");
    print_reverse_queue(q);
    {
      Iterator it = new_iterator(q); 
      const char *nisse = "Nisse";
      find(it, daniel);
      CHECK_CONDITION(get_current(it) == daniel, "Fel: Iteratorn refererar ej till \"Daniel\"!");
      change_current(it, nisse);
      printf("Nu skall \"Daniel\" vara utbytt mot \"Nisse\":\n");
      print_queue(q);
      CHECK_CONDITION(get_current(it) == nisse, "Fel: change_current misslyckades!");
      remove_current(it);
      printf("Nu skall \"Nisse\" vara borttagen:\n");
      print_queue(q);   
      CHECK_CONDITION(get_current(it) == lisa, "Fel: efter remove_current skall iteratorn peka på följande element (i.e. \"Lisa\")!");
      find(it, nisse);
      CHECK_CONDITION(get_current(it) != nisse, "Fel: remove_current misslyckades (Nisse är kvar)!");
      clear(q);
      printf("Nu skall storleken vara lika med 0 och inga element skall skrivas ut:\n");
      printf("Storlek = %d\n", size(q));
      print_queue(q);
      delete_iterator(it);
    }
    delete_queue(q);
#ifdef _MSC_VER
    CHECK_CONDITION(!_CrtDumpMemoryLeaks(), "Ditt program läcker minne, har du glömt att köra free på något som du fått från malloc?\n");
#endif // _MSC_VER

    printf("Tryck på Enter för att avsluta: ");
    getchar();
    return 0;
}

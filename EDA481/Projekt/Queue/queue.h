 // Filen queue.h
 // Makrot DATA skall ange typen för sådana data som skall läggas i kön.
 // Det bör ha definierats av användaren, annars sätts det här till void.

 #ifndef DATA
 #define DATA void 
 #endif

 #ifndef QUEUE_H
 #define QUEUE_H

 struct qstruct;                              // anger att qstruct och qiteratorstruct
 struct qiteratorstruct;                      // definieras på annat ställe

 typedef struct qstruct *Queue;               // typerna Queue och Iterator
 typedef struct qiteratorstruct *Iterator;    // skall utnyttjas av användaren

 Queue new_queue();                   // allokerar minnesutrymme för en ny kö
 void delete_queue(Queue q);          // tar bort kön helt och hållet
 void clear(Queue q);                 // tar bort köelementen men behåller kön
 int  size(Queue q);                          // ger köns aktuella längd
 void add(Queue q, int priority, DATA *d);    // lägger in d på rätt plats 
 DATA *get_first(Queue q);                    // avläser första dataelementet 
 void remove_first(Queue q);                   // tar bort det första elementet

 Iterator new_iterator(Queue q);       // allokerar utrymme för en ny iterator
 void delete_iterator(Iterator it);    // tar bort iteratorn
 void go_to_first(Iterator it);        // går till köns första element
 void go_to_last(Iterator it);         // går till köns sista element
 void go_to_next(Iterator it);         // går till till nästa element
 void go_to_previous(Iterator it);     // går till föregående element
 DATA *get_current(Iterator it);       // ger pekare till aktuellt dataelementet 
 int is_valid(Iterator it);            // returnerar 0 om iteratorn inte är giltlig, 
                                       // dvs inte refererar något element, annars 1.
 void change_current(Iterator it, DATA *d); // ändrar aktuellt dataelementet
 void remove_current(Iterator it);         // tar bort aktuellt dataelement
 void find(Iterator it, DATA *d);          // söker d, iteratorn kommer att
                                           // referera till *d eller vara ogiltlig.
 #endif

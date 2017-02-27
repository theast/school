 // Filen queue.h
 // Makrot DATA skall ange typen f�r s�dana data som skall l�ggas i k�n.
 // Det b�r ha definierats av anv�ndaren, annars s�tts det h�r till void.

 #ifndef DATA
 #define DATA void 
 #endif

 #ifndef QUEUE_H
 #define QUEUE_H

 struct qstruct;                              // anger att qstruct och qiteratorstruct
 struct qiteratorstruct;                      // definieras p� annat st�lle

 typedef struct qstruct *Queue;               // typerna Queue och Iterator
 typedef struct qiteratorstruct *Iterator;    // skall utnyttjas av anv�ndaren

 Queue new_queue();                   // allokerar minnesutrymme f�r en ny k�
 void delete_queue(Queue q);          // tar bort k�n helt och h�llet
 void clear(Queue q);                 // tar bort k�elementen men beh�ller k�n
 int  size(Queue q);                          // ger k�ns aktuella l�ngd
 void add(Queue q, int priority, DATA *d);    // l�gger in d p� r�tt plats 
 DATA *get_first(Queue q);                    // avl�ser f�rsta dataelementet 
 void remove_first(Queue q);                   // tar bort det f�rsta elementet

 Iterator new_iterator(Queue q);       // allokerar utrymme f�r en ny iterator
 void delete_iterator(Iterator it);    // tar bort iteratorn
 void go_to_first(Iterator it);        // g�r till k�ns f�rsta element
 void go_to_last(Iterator it);         // g�r till k�ns sista element
 void go_to_next(Iterator it);         // g�r till till n�sta element
 void go_to_previous(Iterator it);     // g�r till f�reg�ende element
 DATA *get_current(Iterator it);       // ger pekare till aktuellt dataelementet 
 int is_valid(Iterator it);            // returnerar 0 om iteratorn inte �r giltlig, 
                                       // dvs inte refererar n�got element, annars 1.
 void change_current(Iterator it, DATA *d); // �ndrar aktuellt dataelementet
 void remove_current(Iterator it);         // tar bort aktuellt dataelement
 void find(Iterator it, DATA *d);          // s�ker d, iteratorn kommer att
                                           // referera till *d eller vara ogiltlig.
 #endif

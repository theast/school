#include "queue.h"
#include <stdlib.h>
/* Implementera interface från queue.h här */
struct qelemstruct {
	struct qelemstruct *next, *prev;
	int prio;
	DATA *data;
};
struct qstruct {
	struct qelemstruct *head;
	int length;
};
struct qiteratorstruct {
	struct qstruct *q;
	struct qelemstruct *curr;
};

Queue new_queue()
{
	struct qstruct* q = malloc(sizeof(struct qstruct));
	struct qelemstruct* el = malloc(sizeof(struct qelemstruct));
	el->next = el;
	el->prev = el;
	el->prio = 0;
	el->data = 0;
	q -> head = el;
	q -> length = 0;
	return q;
}
void delete_queue(Queue q)
{
	clear(q);
	free(q->head);
	free(q);
}
void clear (Queue q)
{
	Iterator it = new_iterator(q);
	while (is_valid(it)) {
		remove_current(it);
		it = new_iterator(q);
	}
	delete_iterator(it);
	q->length = 0;
}
int size (Queue q)
{
	return q->length;
}
void add(Queue q, int priority, DATA*d)
{
	Iterator it = new_iterator(q);
	struct qelemstruct* el = malloc(sizeof(struct qelemstruct));
	el->next = el;
	el->prev = el;
	el->prio = priority;
	el->data = d;
	if(is_valid(it)) {
		while (is_valid(it)) {
			if (priority > it->curr->prio) {
				el->next = it->curr;
				el->prev = it->curr->prev;
				it->curr->prev->next = el;
				it->curr->prev = el;
				q->length++;
				delete_iterator(it);
				return;
			}
			go_to_next(it);
		}
		go_to_last(it);
		el->prev = it->curr;
		el->next = it->curr->next;
		it->curr->next->prev = el;
		it->curr->next = el;
	} else {
		q->head->next = el;
		q->head->prev = el;
		el->next = q->head;
		el->prev = q->head;
	}
	q->length++;
	delete_iterator(it);
}
DATA *get_first(Queue q)
{
	return q->head->next->data;
}
void remove_first (Queue q)
{
	Iterator it = new_iterator(q);
	go_to_first(it);
	remove_current(it);
	delete_iterator(it);
}
Iterator new_iterator(Queue q)
{
	Iterator it = malloc(sizeof(struct qiteratorstruct));
	it->q = q;
	go_to_first(it);
	return it;
}
void delete_iterator(Iterator it)
{
	free(it);
}
void go_to_first (Iterator it)
{
	it->curr = it->q->head->next;
}
void go_to_last (Iterator it)
{
	it->curr = it->q->head->prev;
}
void go_to_next (Iterator it)
{
	if (is_valid(it)) {
		it ->curr = it->curr->next;
	}
}
void go_to_previous (Iterator it)
{
	if (is_valid(it)) {
		it->curr = it->curr->prev;
	}
}
DATA *get_current(Iterator it)
{
	return it->curr->data;
}
int is_valid(Iterator it)
{
	if (it->curr == it->q->head) {
		return 0;
	} else {
		return 1;
	}
}
void change_current(Iterator it, DATA *d)
{
	if (is_valid(it)) {
		it->curr->data = d;
	}
}
void remove_current(Iterator it)
{
	if (is_valid(it)){
	struct qelemstruct* el = it->curr;
	go_to_next(it);
	el->next->prev = el->prev;
	el->prev->next = el->next;
	free(el);
	it->q->length--;
	}
}
void find(Iterator it, DATA *d)
{
	go_to_first(it);
	
	while (is_valid(it)) {
		if (it->curr->data == d)
			return;
			
	go_to_next(it);
	}
	
}


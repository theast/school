#include "queue.h"

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

Queue new_queue() {
	Queue q = malloc(sizeof(struct qstruct));
	if(!q)
		return 0;
	q->head = malloc(sizeof(struct qelemstruct));
	if(!q->head) {
		free(q);
		return 0;
	}
	q->length = 0;
	q->head->data = 0;
	q->head->next = q->head->prev = q->head;
	q->head->prio = 0;
	return q;
}

void delete_queue(Queue q) {
	if(!q)
		return;
	struct qelemstruct *qelem = q->head;
	if(qelem->next != q->head)
		do {
			qelem = qelem->next;
			free(qelem->prev);
		} while(qelem->next != q->head);
	free(qelem);
	free(q);
}

void clear(Queue q) {
	if(!q || q->head->next == q->head)
		return;
	struct qelemstruct *qelem = q->head->next;
	do {
		qelem = qelem->next;
		free(qelem->prev);
	} while(qelem != q->head);
	q->length = 0;
	q->head->next = q->head->prev = q->head;
}

int size(Queue q) {
	if(!q)
		return 0;
	return q->length;
}

void add(Queue q, int priority, DATA *d) {
	if(!q)
		return;
	struct qelemstruct *qelem_add = malloc(sizeof(struct qelemstruct)),
			*qelem = q->head;
	if(!qelem_add)
		return;
	qelem_add->prio = priority;
	qelem_add->data = d;
	while(qelem->prev != q->head && qelem->prev->prio < priority)
		qelem = qelem->prev;
	qelem_add->next = qelem;
	qelem_add->prev = qelem->prev;
	qelem->prev->next = qelem->prev = qelem_add;
	q->length++;
}

DATA *get_first(Queue q) {
	if(!q)
		return 0;
	return q->head->next->data;
}

void remove_first(Queue q) {
	if(!q || q->head->next == q->head)
		return;
	struct qelemstruct *qelem = q->head->next;
	qelem->prev->next = qelem->next;
	qelem->next->prev = qelem->prev;
	free(qelem);
	q->length--;
}

Iterator new_iterator(Queue q) {
	if(!q)
		return 0;
	struct qiteratorstruct *qit = malloc(sizeof(struct qiteratorstruct));
	if(!qit)
		return 0;
	qit->curr = q->head->next;
	qit->q = q;
	return qit;
}

void delete_iterator(Iterator it) {
	if(!it)
		return;
	free(it);
}

void go_to_first(Iterator it) {
	if(!it)
		return;
	it->curr = it->q->head->next;
}

void go_to_last(Iterator it) {
	if(!it)
		return;
	it->curr = it->q->head->prev;
}

void go_to_next(Iterator it) {
	if(!it || it->curr == it->q->head)
		return;
	it->curr = it->curr->next;
}

void go_to_previous(Iterator it) {
	if(!it || it->curr == it->q->head)
		return;
	it->curr = it->curr->prev;
}

DATA *get_current(Iterator it) {
	if(!it)
		return 0;
	return it->curr->data;
}

int is_valid(Iterator it) {
	return it && it->curr != it->q->head;
}

void change_current(Iterator it, DATA *d) {
	if(!it || it->curr == it->q->head)
		return;
	it->curr->data = d;
}

void remove_current(Iterator it) {
	if(!it || it->curr == it->q->head)
		return;
	struct qelemstruct *qelem = it->curr;
	it->curr = qelem->next;
	qelem->prev->next = qelem->next;
	qelem->next->prev = qelem->prev;
	free(qelem);
	it->q->length--;
}

void find(Iterator it, DATA *d) {
	if(!it)
		return;
	it->curr = it->q->head->next;
	while(it->curr != it->q->head) {
		if(it->curr->data == d)
			return;
		it->curr = it->curr->next;
	}
}
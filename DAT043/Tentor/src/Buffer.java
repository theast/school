import java.util.concurrent.Semaphore;

public class Buffer<E> {
	private E[] buffer;
	private Semaphore empty, full, mutexPut, mutexTake;
	private int front, rear, capacity;
	
	public static void main(String[] args){
		new Buffer(5);
	}
	
	public Buffer(int capacity){
		this.capacity = capacity;
		buffer = (E[]) new Object[capacity];
		front = 0;
		rear = 0;
		empty = new Semaphore(capacity, true);
		full = new Semaphore(0, true);
		mutexPut = new Semaphore(1, true);
		mutexTake = new Semaphore(1, true);
	}
	
	public void Put(E element) throws InterruptedException{
		empty.acquire();
		mutexPut.acquire();
		buffer[front] = element;
		front = (front+1) % capacity;
		mutexPut.release();
		full.release();	
	}
	
	public E take() throws InterruptedException{
		full.acquire();
		mutexTake.acquire();
		E result = buffer[rear];
		rear = (rear+1) % capacity;
		mutexTake.release();
		full.release();
		return result;
	}
}

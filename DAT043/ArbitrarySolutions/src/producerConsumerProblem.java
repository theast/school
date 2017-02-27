import java.util.concurrent.*;

public class producerConsumerProblem {

	private int[] buffer;
	private Semaphore full;
	private Semaphore empty;
	private Thread prod;
	private Thread[] consumers;
	private int front;
	private int rear;
	private int bufferSize;

	public static void main(String[] args){
		new producerConsumerProblem(10);
	}

	public producerConsumerProblem(int bufferSize){
		this.bufferSize = bufferSize;
		front = 0;
		rear = 0;
		buffer = new int[bufferSize];
		full = new Semaphore(0, true);
		empty = new Semaphore(bufferSize, true);
		prod = new Thread(new Producer());
		consumers = new Thread[bufferSize];
		prod.start();
		for (int i = 0; i < bufferSize; i++){
			consumers[i] = new Thread(new Consumer(i));
			consumers[i].start();
		}
	}

	public class Producer implements Runnable {

		public void run() {
			while (true){
				try {empty.acquire();}
				catch (InterruptedException e) {} ;

				System.out.println("Producer making some sushi..");
				buffer[front] = (int)(Math.random() * 10); // 10 Different sushi dishes :D
				front = (front+1) % bufferSize;
				try { Thread.sleep(100 + (int)(Math.random()*1000)); }	
				catch (InterruptedException e) {} ;

				full.release();
			}
		}
	}

	public class Consumer implements Runnable {
		int id;

		public Consumer(int id){
			this.id = id;
		}

		public void run() {

			while (true){
				try { full.acquire(); }
				catch (InterruptedException E) {} ;
				
				System.out.println("Consumer" + id + " eating");
				buffer[rear] = 0;
				rear = (rear+1) % bufferSize;
				
				try { Thread.sleep(1000 + (int)(Math.random()*1000)); }
				catch (InterruptedException e) {} ;
					
				empty.release();
			}
		}
	}
}

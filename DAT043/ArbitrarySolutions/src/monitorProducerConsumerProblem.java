import java.util.concurrent.locks.Condition;
import java.util.concurrent.locks.Lock;
import java.util.concurrent.locks.ReentrantLock;

public class monitorProducerConsumerProblem {
	
		private int[] buffer;
		private Lock lock = new ReentrantLock();
		private Condition waitingToBeFull = lock.newCondition();
		private Condition waitingToBeEmpty = lock.newCondition();
		private int freeElements;
		private int eatableElements;
		private Thread prod;
		private Thread[] consumers;
		private int front;
		private int rear;
		private int bufferSize;

		public static void main(String[] args){
			new monitorProducerConsumerProblem(10);
		}

		public monitorProducerConsumerProblem(int bufferSize){
			this.bufferSize = bufferSize;
			front = 0;
			rear = 0;
			freeElements = bufferSize;
			eatableElements = 0;
			buffer = new int[bufferSize];
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
					lock.lock();
					while(freeElements == 0){
					try { waitingToBeEmpty.await();	}
					catch (InterruptedException e) {} ;
					}
					freeElements--;
					eatableElements++;
					
					System.out.println("Producer making some sushi..");
					buffer[front] = (int)(Math.random() * 10); // 10 Different sushi dishes :D
					front = (front+1) % bufferSize;
					waitingToBeFull.signalAll();
					lock.unlock();
					
					
					try { Thread.sleep(100 + (int)(Math.random()*1000)); }	
					catch (InterruptedException e) {} ;
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
					
					lock.lock();
					while (eatableElements == 0){
						try { waitingToBeFull.await(); }
						catch (InterruptedException e) {};
					}
					freeElements++;
					eatableElements--;
			
					System.out.println("Consumer" + id + " eating");
					buffer[rear] = 0;
					rear = (rear+1) % bufferSize;
					waitingToBeEmpty.signalAll();
			
					
					lock.unlock();
					
					
					try { Thread.sleep(1000 + (int)(Math.random()*1000)); }
					catch (InterruptedException e) {} ;
				}
			}
		}


	
	
	
	
	
	
	
	
	
	
}

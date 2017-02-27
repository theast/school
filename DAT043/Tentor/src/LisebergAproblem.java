import java.util.concurrent.Semaphore;

public class LisebergAproblem {
	private Thread east;
	private Thread west;
	private int counter = 0;
	private Semaphore mutex = new Semaphore(1, true);

	public void enter(){
		counter++;
	}

	public void done(){
		System.out.println("Counter; " + counter);
	}

	public class Person implements Runnable {
		String x;
		
		public Person(String x){
			this.x = x;
		}
		
		public void run() {
			try {
				Thread.sleep(500 + (int) Math.random()*1000);
			} catch (InterruptedException e1) {
				// TODO Auto-generated catch block
				e1.printStackTrace();
			}
			for (int i = 0; i < 1000; i++){
				try {
					mutex.acquire();
				} catch (InterruptedException e) {
					// TODO Auto-generated catch block
					e.printStackTrace();
				}
				System.out.println("Process "+x+" enters "+i);
				enter();
				mutex.release();
			}	
			done();
		}
	}

	public static void main(String[] args){
		new LisebergAproblem();
	}

	public LisebergAproblem(){
		east = new Thread(new Person("East"));
		west = new Thread (new Person("West"));
		
		east.start();
		west.start();
	}
}

import java.util.concurrent.Semaphore;

public class BarberProblem {

	private Thread barber1;
	private Thread barber2;
	private Thread barber3;
	private Barber b1;
	private Barber b2;
	private Barber b3;
	
	public static void main(String[] args){
		new BarberProblem();
	}
	
	public BarberProblem(){
		b1 = new Barber(1);
		b2 = new Barber(2);
		b3 = new Barber(3);
		barber1 = new Thread(b1);
		barber2 = new Thread(b2);
		barber3 = new Thread(b3);
		barber1.start();
		barber2.start();
		barber3.start();
		client(10);
	}
	
	public void client(int n){
		for (int i = 0; i < n; i++){
			 int barber = i%3;
			if (barber == 0){
				System.out.println("Client "+i+" choose the chair "+(barber+1)) ;
				b1.tryAcquire(b1.chair);
				System.out.println("Client "+i+" pressed button "+(barber+1)) ;
				b1.button.release();
				b1.tryAcquire(b1.done);
				b1.chair.release();
			}
			else if (barber == 1){
				System.out.println("Client "+i+" choose the chair "+(barber+1)) ;
				b2.tryAcquire(b2.chair);
				System.out.println("Client "+i+" pressed button "+(barber+1)) ;
				b2.button.release();
				b2.tryAcquire(b2.done);
				b2.chair.release();
			} 
			else {
				System.out.println("Client "+i+" choose the chair "+(barber+1)) ;
				b3.tryAcquire(b3.chair);
				System.out.println("Client "+i+" pressed button "+(barber+1)) ;
				b3.button.release();
				b3.tryAcquire(b3.done);
				b3.chair.release();
			}
		}
	}
	
	public static class Barber implements Runnable {
		private Semaphore chair;
		private Semaphore button;
		private Semaphore done;
		private int id;
		
		public Barber(int id){
			chair =  new Semaphore(1, true);
			button = new Semaphore(0, true);
			done = new Semaphore(0, true);
			this.id = id;
		}
		
		public void tryAcquire(Semaphore mutex){
			try{
				mutex.acquire();
			} catch(InterruptedException e){
				e.printStackTrace();    // or only e.getMessage() for the error
				System.exit(1);
			}
		}
		
		@Override
		public void run() {
			while(true){
		System.out.println("Siesta time for Barber "+id) ;
		tryAcquire(button);
		System.out.println("Barber" + id + " cutting");
		try {
			Thread.sleep(100);
		} catch (InterruptedException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
		
		done.release();
		System.out.println("Barber" + id + " done cutting");
			}
		}
	}
}

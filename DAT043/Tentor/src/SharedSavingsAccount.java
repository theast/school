import java.util.concurrent.locks.*;

public class SharedSavingsAccount implements Runnable {
	protected int balance;
	private final Lock lock = new ReentrantLock();
	private final Condition toBeAvailable = lock.newCondition();

	public SharedSavingsAccount(int initialBalance){
		balance = initialBalance;
	}
	
	public void deposit(int amount) {
		lock.lock();
		balance += amount;
		System.out.println("Depositing: " + amount + " Balance: " + balance);
		toBeAvailable.signalAll();
		lock.unlock();
	}
	
	public void withdraw(int amount) throws InterruptedException{
		lock.lock();
		while ((balance - amount) < 0){
			toBeAvailable.await();
		}
	
		balance -= amount;
		System.out.println("Withdrawing: " + amount + " Balance: " + balance);	
		
		lock.unlock();
	}
	
	
	public static void main(String[] args) throws InterruptedException{
		SharedSavingsAccount yada = new SharedSavingsAccount(5000);
		Thread user1 = new Thread(yada);
		Thread user2 = new Thread(yada);
		user1.start();
		user2.start();
	}

	@Override
	public void run() {
		while(true){
			
			try {
				withdraw(100);
			} catch (InterruptedException e) {
				// TODO Auto-generated catch block
				e.printStackTrace();
			}
			deposit(200);
			try {
				withdraw(600);
			} catch (InterruptedException e) {
				// TODO Auto-generated catch block
				e.printStackTrace();
			}
			
			
		}
		
	}
}

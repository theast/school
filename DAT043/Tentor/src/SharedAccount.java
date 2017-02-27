import java.util.concurrent.locks.*;


public class SharedAccount  {

	private long balance;
	private Lock lock = new ReentrantLock();
	private Condition waitForCash = lock.newCondition();
	SharedAccount yada;
	
	public SharedAccount(long initialBalance) {
		balance = initialBalance;
	}
	
	public void deposit(int amount) {
		lock.lock();
		balance += amount;
		waitForCash.signalAll();
		lock.unlock();
	}
	
	public void withdraw(int amount) throws InterruptedException {
		lock.lock();
		while(amount > balance)
			waitForCash.await();
		balance -= amount;
		lock.unlock();	
	}
}

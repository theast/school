import java.util.concurrent.locks.Condition;
import java.util.concurrent.locks.Lock;
import java.util.concurrent.locks.ReentrantLock;

public class SID {
	int searchers = 0, deleters = 0, inserters = 0;
	private final Lock lock = new ReentrantLock();
	private final Condition waitingToSearch = lock.newCondition();
	private final Condition waitingToDelete = lock.newCondition();
	private final Condition waitingToInsert = lock.newCondition();
	
	public void startSearch(){
		lock.lock();
		while (deleters > 0) try {waitingToSearch.await();} catch (InterruptedException e){};
		searchers++;
		lock.unlock();		
	}
	
	public void endSearch(){
		lock.lock();
		searchers--;
		waitingToDelete.signal();		
		lock.unlock();
	}
	
	public void startInsert(){
		lock.lock();
		while (inserters > 0 || deleters > 0) try {waitingToInsert.await();} catch (InterruptedException e){};
		inserters++;
		lock.unlock();
	}
	
	public void endInsert(){
		lock.lock();
		inserters--;
		waitingToInsert.signal();
		if (inserters == 0) waitingToDelete.signal();
		lock.unlock();
	}
	
	public void startDelete () {
		lock.lock();
		while(searchers > 0 || inserters > 0 || deleters > 0) try {waitingToDelete.await();}catch(InterruptedException e){}
		deleters++;
		lock.unlock();
	}
	
	public void endDelete(){
		lock.lock();
		deleters--;
		waitingToSearch.signalAll();
		waitingToInsert.signal();
		waitingToDelete.signal();
		lock.unlock();
	}
}

work_load([], _, [], Results) -> Results;

work_load([Task | Tasks], [PWorker | PWorkers], AWorkers, Results) ->
	{Chunk, TTasks} = obtain_tasks([Task|Tasks]),
	self() ! {PWorker, Chunk},
	workload(Tasks, PWorkers, [PWorker | AWorkers], Results);


work_load(Tasks, PWorkers, AWorkers, Results) ->
receive
	{Worker, Result} ->
		work_load(Tasks, [Worker | PWorkers], lists:delete(Worker, AWorkers), combine_result(Result, Results))
end.
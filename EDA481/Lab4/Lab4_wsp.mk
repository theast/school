.PHONY: clean All

All:
	@echo "----------Building project:[ queue - Debug ]----------"
	@cd "queue" && $(MAKE) -f  "queue.mk"
clean:
	@echo "----------Cleaning project:[ queue - Debug ]----------"
	@cd "queue" && $(MAKE) -f  "queue.mk" clean

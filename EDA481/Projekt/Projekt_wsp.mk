.PHONY: clean All

All:
	@echo "----------Building project:[ uppg - Debug ]----------"
	@cd "uppg" && $(MAKE) -f  "uppg.mk"
clean:
	@echo "----------Cleaning project:[ uppg - Debug ]----------"
	@cd "uppg" && $(MAKE) -f  "uppg.mk" clean

function [ nErrors ] = check_errors(y, classifier)

nErrors = 0;
for j=1:size(y,1)
   if y(j) ~= classifier(j)
       nErrors = nErrors + 1;
   end
end

end


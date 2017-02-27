function [ trainingdata ] = fixpartitions(p1, p2, p3, p4)
[n, p] = size(p1);
class1 = vertcat(vertcat(vertcat(p1(1:n/2, :), p2(1:n/2, :)), p3(1:n/2, :)), p4(1:n/2, :));
class2 = vertcat(vertcat(vertcat(p1(n/2+1:n, :), p2(n/2+1:n, :)), p3(n/2+1:n, :)), p4(n/2+1:n, :));
trainingdata = vertcat(class1, class2);
end

